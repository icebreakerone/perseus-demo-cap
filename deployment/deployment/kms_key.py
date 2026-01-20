from aws_cdk import aws_kms as kms, aws_iam as iam, Tags, Aws, CfnOutput

from constructs import Construct


class ProvenanceKmsKey(Construct):
    """Creates a KMS key for ECC P-256 signing operations."""

    def __init__(self, scope: Construct, id: str, environment_name: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # Create KMS key with ECC P-256 specification for signing
        self.key = kms.Key(
            self,
            "ProvenanceSigningKey",
            description=f"Provenance signing key (ECDSA P-256) for {environment_name}",
            key_spec=kms.KeySpec.ECC_NIST_P256,
            key_usage=kms.KeyUsage.SIGN_VERIFY,
            enable_key_rotation=False,  # ECC keys don't support rotation
        )

        # Add alias for easier reference
        kms.Alias(
            self,
            "ProvenanceSigningKeyAlias",
            alias_name=f"alias/provenance-signing-key-{environment_name}",
            target_key=self.key,
        )

        # Add tags
        Tags.of(self.key).add("ResourceType", "kms-key")
        Tags.of(self.key).add("Purpose", "provenance-signing")
        Tags.of(self.key).add("Environment", environment_name)

        # Grant permissions to the account root (standard KMS policy)
        self.key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Enable IAM User Permissions",
                effect=iam.Effect.ALLOW,
                principals=[iam.AccountRootPrincipal()],
                actions=["kms:*"],
                resources=["*"],
            )
        )
        # Output the Key ARN so other stacks can easily use it
        self.key_arn = self.key.key_arn

        CfnOutput(
            self,
            "ProvenanceSigningKeyArnOutput",
            value=self.key_arn,
            description=f"ARN of the Provenance signing key (ECDSA P-256) for {environment_name}",
            export_name=f"provenance-signing-key-arn-{environment_name}",
        )
