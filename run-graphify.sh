#!/bin/bash
# Generate full knowledge graph from Obsidian vault using custom pipeline
cd /home/adrian/Desktop/NEDAILAB/ROTUS
source venv/bin/activate
python3 scripts/generate_graph_from_vault.py
