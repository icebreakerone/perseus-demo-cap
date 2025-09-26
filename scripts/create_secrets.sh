#!/bin/bash
# Allow ENV to be provided as an argument, default to 'dev'
ENV="${1:-dev}"

# Define file paths for your local certificate files
MTLS_KEY_PATH="../certs/cap-demo-certs/cap-demo-key.pem"
MTLS_BUNDLE_PATH="../certs/cap-demo-certs/cap-demo-bundle.pem"
# SERVER_CA_PATH="../certs/directory-server-certificates/bundle.pem"

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
