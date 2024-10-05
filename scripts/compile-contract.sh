#!/bin/sh

set -e

CONTRACTS_FOLDER=$1
CONTRACT_FOLDER=$2
CONTRACT_NAME=$3

if [ -z "$CONTRACTS_FOLDER" ] || [ -z "$CONTRACT_FOLDER" ] || [ -z "$CONTRACT_NAME" ]; then
  echo "Usage: $0 <contracts-folder> <contract-folder> <contract-name>"
  exit 1
fi

cd $CONTRACTS_FOLDER/$CONTRACT_FOLDER
aztec-nargo compile
aztec codegen ./target/$CONTRACT_FOLDER-$CONTRACT_NAME.json
jq '.file_map = {}' ./target/$CONTRACT_FOLDER-$CONTRACT_NAME.json > temp.json && mv temp.json ./target/$CONTRACT_FOLDER-$CONTRACT_NAME.json
