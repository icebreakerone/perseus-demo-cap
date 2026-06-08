#!/bin/bash
# Upload mTLS key + certificate bundle to AWS Secrets Manager.
#
# Usage:
#   ./create_secrets.sh [ENV] [-k|--key KEY_PATH] [-b|--bundle BUNDLE_PATH]
#
#   ENV            Environment / secret prefix (default: dev)
#   -k, --key      Path to the mTLS private key PEM
#                  (default: ../certs/cap-demo-certs/cap-demo-key.pem)
#   -b, --bundle   Path to the mTLS certificate bundle PEM
#                  (default: ../certs/cap-demo-certs/cap-demo-bundle.pem)
#
# Examples:
#   ./create_secrets.sh dev
#   ./create_secrets.sh dev --key ./dev-key.pem --bundle ./dev-bundle.pem

usage() {
  sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

# Defaults
ENV="dev"
MTLS_KEY_PATH="../certs/cap-demo-certs/cap-demo-key.pem"
MTLS_BUNDLE_PATH="../certs/cap-demo-certs/cap-demo-bundle.pem"
# SERVER_CA_PATH="../certs/directory-server-certificates/bundle.pem"

# Parse arguments: ENV is an optional positional, key/bundle are flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    -k|--key)
      MTLS_KEY_PATH="$2"
      shift 2
      ;;
    -b|--bundle)
      MTLS_BUNDLE_PATH="$2"
      shift 2
      ;;
    -h|--help)
      usage 0
      ;;
    -*)
      echo "Error: unknown option '$1'" >&2
      usage 1
      ;;
    *)
      ENV="$1"
      shift
      ;;
  esac
done

# Define secret name and description
SECRET_NAME="${ENV}/perseus-demo-cap/mtls-key-bundle"
SECRET_DESCRIPTION="Certificates and keys for mTLS"

# Check if the files exist
if [[ ! -f "$MTLS_KEY_PATH" ]]; then
  echo "Error: $MTLS_KEY_PATH not found."
  exit 1
fi

if [[ ! -f "$MTLS_BUNDLE_PATH" ]]; then
  echo "Error: $MTLS_BUNDLE_PATH not found."
  exit 1
fi

# if [[ ! -f "$SERVER_CA_PATH" ]]; then
#   echo "Error: $SERVER_CA_PATH not found."
#   exit 1
# fi

# Read the contents of the certificate files
MTLS_KEY=$(cat "$MTLS_KEY_PATH")
MTLS_BUNDLE=$(cat "$MTLS_BUNDLE_PATH")
# SERVER_CA=$(cat "$SERVER_CA_PATH")

# Replace newlines with escaped newlines using parameter expansion
MTLS_KEY_ESCAPED="${MTLS_KEY//$'\n'/\\n}"
MTLS_BUNDLE_ESCAPED="${MTLS_BUNDLE//$'\n'/\\n}"
# SERVER_CA_ESCAPED="${SERVER_CA//$'\n'/\\n}"
# Create a JSON payload for the secret
SECRET_PAYLOAD=$(cat <<EOF
{
  "mtlsKey": "$MTLS_KEY_ESCAPED",
  "mtlsBundle": "$MTLS_BUNDLE_ESCAPED"
}
EOF
)

# Create the secret in Secrets Manager using AWS CLI
aws secretsmanager update-secret \
  --secret-id "$SECRET_NAME" \
  --description "$SECRET_DESCRIPTION" \
  --secret-string "$SECRET_PAYLOAD" \
  --region eu-west-2  # Update with your desired AWS region

# Check if the secret was created successfully
if [ $? -eq 0 ]; then
  echo "Secret '$SECRET_NAME' created successfully."
else
  echo "Failed to create secret."
fi
