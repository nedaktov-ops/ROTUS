#!/usr/bin/env python3
"""
Generate a knowledge graph from the Obsidian vault.
This script parses markdown notes, extracts wikilinks, and builds a graph using Graphify.
Outputs: graphify-out/graph.json, graphify-out/graph.html, graphify-out/GRAPH_REPORT.md
"""

import os
import re
import json
import yaml
from datetime import date, datetime
from pathlib import Path
from collections import defaultdict

import networkx as nx
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html

VAULT_ROOT = Path('obsidian-vault').resolve()
OUTPUT_DIR = Path('graphify-out').resolve()
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def safe_id(s: str) -> str:
    """Normalize to Graphify's ID format: lowercase, non-alphanum → '_'."""
    cleaned = re.sub(r'[^a-zA-Z0-9]+', '_', s).strip('_').lower()
    return cleaned

def parse_frontmatter(content: str):
    """Return (frontmatter_dict, body) splitting on first '---'."""
    if content.startswith('---'):
        end = content.find('---', 3)
        if end != -1:
            fm = content[3:end].strip()
            body = content[end+3:].lstrip()
            try:
                return yaml.safe_load(fm) or {}, body
            except yaml.YAMLError:
                return {}, content
    return {}, content

def extract_title(body: str, filename_stem: str) -> str:
    """First H1 heading, or filename stem."""
    m = re.search(r'^#\s+(.+)$', body, re.MULTILINE)
    if m:
        return m.group(1).strip()
    return filename_stem.replace('-', ' ').replace('_', ' ').title()

def gather_notes():
    """Walk vault and return list of note dicts with node info."""
    nodes = []
    filename_to_id = {}  # stem → node id
    for root, dirs, files in os.walk(VAULT_ROOT):
        # Skip hidden dirs and graphify-out
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'graphify-out']
        for f in files:
            if not f.endswith('.md'):
                continue
            full_path = Path(root) / f
            rel_path = full_path.relative_to(VAULT_ROOT).as_posix()
            content = full_path.read_text(encoding='utf-8')
            fm, body = parse_frontmatter(content)
            filename_stem = Path(f).stem
            # Node ID
            node_id = safe_id(rel_path.replace('.md', ''))
            # Label
            label = extract_title(body, filename_stem)
            # Folder category
            folder = rel_path.split('/')[0] if '/' in rel_path else 'root'
            node = {
                'id': node_id,
                'label': label,
                'file_type': 'document',
                'source_file': rel_path,
                'vault_folder': folder,
            }
            # Include frontmatter fields, but preserve our node ID
            for k, v in fm.items():
                if k == 'id':
                    node['quote_id'] = v  # don't overwrite node id
                else:
                    node[k] = v
            nodes.append(node)
            filename_to_id[filename_stem.lower()] = node_id
            # Also index by title? Possibly skip.
    # Sanitize date/datetime objects to ISO strings for JSON serialization
    for node in nodes:
        for k, v in list(node.items()):
            if isinstance(v, (date, datetime)):
                node[k] = v.isoformat()
    return nodes, filename_to_id

def extract_edges(nodes, filename_to_id):
    """Second pass: for each note, find [[wikilinks]] and produce edges."""
    edges = []
    for node in nodes:
        rel_path = node['source_file']
        full_path = VAULT_ROOT / rel_path
        content = full_path.read_text(encoding='utf-8')
        # Find all wikilinks: [[target]] or [[target|display]]
        for m in re.finditer(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', content):
            target = m.group(1).strip()
            # Remove .md extension if present
            if target.lower().endswith('.md'):
                target = target[:-3]
            target_key = target.lower()
            if target_key in filename_to_id:
                target_id = filename_to_id[target_key]
                edges.append({
                    'source': node['id'],
                    'target': target_id,
                    'relation': 'links_to',
                    'confidence': 'EXTRACTED',
                    'weight': 1.0,
                    'source_file': rel_path,
                })
    return edges

def compute_detection(nodes, total_words):
    return {
        'total_files': len(nodes),
        'total_words': total_words,
        'warning': None,
    }

def add_tag_nodes_and_edges(nodes):
    """Create tag nodes and edges based on 'tags' field in note nodes."""
    tag_nodes = []
    tag_edges = []
    tag_ids = set()

    # Collect all unique tags
    all_tags = set()
    for node in nodes:
        tags = node.get('tags', [])
        if isinstance(tags, list):
            all_tags.update(tags)

    # Create tag nodes
    for tag in all_tags:
        tag_id = safe_id('tag_' + tag)
        if tag_id in tag_ids:
            continue
        tag_nodes.append({
            'id': tag_id,
            'label': tag,
            'file_type': 'document',
            'source_file': '',
            'vault_folder': 'Tags',
        })
        tag_ids.add(tag_id)

    # Create edges from notes to tags
    for node in nodes:
        note_id = node['id']
        tags = node.get('tags', [])
        if isinstance(tags, list):
            for tag in tags:
                tag_id = safe_id('tag_' + tag)
                if tag_id not in tag_ids:
                    # Should exist, but skip if not.
                    continue
                tag_edges.append({
                    'source': note_id,
                    'target': tag_id,
                    'relation': 'has_tag',
                    'confidence': 'EXTRACTED',
                    'weight': 1.0,
                    'source_file': node.get('source_file', ''),
                })
    return tag_nodes, tag_edges

def main():
    print('Scanning Obsidian vault...')
    nodes, filename_to_id = gather_notes()
    print(f'Found {len(nodes)} notes.')

    # Read each file again to extract wikilinks? We already have nodes with source_file; we can just read content now.
    # We'll actually do second pass using nodes list.
    edges = extract_edges(nodes, filename_to_id)
    print(f'Extracted {len(edges)} wikilink edges.')

    # Add tag nodes and edges
    tag_nodes, tag_edges = add_tag_nodes_and_edges(nodes)
    nodes.extend(tag_nodes)
    edges.extend(tag_edges)
    print(f'Added {len(tag_nodes)} tag nodes and {len(tag_edges)} tag edges.')

    # Compute total words (sum of body lengths? approximate)
    total_words = 0
    for node in nodes:
        src = node.get('source_file', '')
        if not src:  # skip tag nodes or any without a file
            continue
        full_path = VAULT_ROOT / src
        content = full_path.read_text(encoding='utf-8')
        # Rough: split on whitespace; exclude frontmatter? Not critical.
        total_words += len(content.split())
    detection = compute_detection(nodes, total_words)

    extraction = {'nodes': nodes, 'edges': edges}
    # Save intermediate extraction (optional)
    (OUTPUT_DIR / 'extraction.json').write_text(json.dumps(extraction, indent=2))
    print('Saved extraction.json')

    # Build graph
    print('Building graph...')
    G = build_from_json(extraction, directed=True)
    print(f'Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges.')

    # Cluster
    print('Clustering...')
    communities = cluster(G)
    cohesion = score_all(G, communities)
    print(f'Communities: {len(communities)}')

    # Analyze
    print('Analyzing...')
    gods = god_nodes(G, top_n=10)
    surprises = surprising_connections(G, communities)
    labels = {}
    for cid, nodes_in_c in communities.items():
        # pick top node by degree
        top = max(nodes_in_c, key=lambda n: G.degree(n))
        label = G.nodes[top].get('label', top)
        labels[cid] = label
    questions = suggest_questions(G, communities, labels)

    # Report
    print('Generating report...')
    token_cost = {'input': 0, 'output': 0}
    report = generate(G, communities, cohesion, labels, gods, surprises, detection, token_cost, str(VAULT_ROOT), suggested_questions=questions)
    (OUTPUT_DIR / 'GRAPH_REPORT.md').write_text(report)
    print('Wrote GRAPH_REPORT.md')

    # Export JSON and HTML
    to_json(G, communities, str(OUTPUT_DIR / 'graph.json'))
    print('Wrote graph.json')
    to_html(G, communities, str(OUTPUT_DIR / 'graph.html'), community_labels=labels)
    print('Wrote graph.html')

    print('Graph generation complete.')

if __name__ == '__main__':
    main()
