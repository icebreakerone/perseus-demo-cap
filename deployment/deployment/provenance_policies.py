from aws_cdk import aws_iam as iam, Aws, Stack
from constructs import Construct


class ProvenanceServicePolicy(Construct):
    """Creates IAM policies for the provenance service including KMS, S3, and SSM permissions."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        app_name: str,
        env_name: str,
        kms_key_arn: str,
        s3_bucket_arn: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        stack = Stack.of(self)

        self.policy = iam.ManagedPolicy(
            self,
            "ProvenanceServicePolicy",
            managed_policy_name=f"{app_name}-{env_name}-ProvenanceServicePolicy",
            statements=[
                # KMS permissions for signing operations
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "kms:Sign",
                        "kms:Verify",
                        "kms:DescribeKey",
                        "kms:GetPublicKey",
                    ],
                    resources=[kms_key_arn],
                ),
                # S3 permissions for reading certificates
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:ListBucket",
                    ],
                    resources=[
                        s3_bucket_arn,
                        f"{s3_bucket_arn}/*",
                    ],
                ),
                # SSM permissions (optional, for fallback key storage)
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                    ],
                    resources=[
                        f"arn:aws:ssm:{stack.region}:{stack.account}:parameter/{app_name}/{env_name}/*",
                        f"arn:aws:ssm:{stack.region}:{stack.account}:parameter/*/provenance-service/*",
                    ],
                ),
                # KMS decrypt for SSM parameters (if using SSM)
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=["kms:Decrypt"],
                    resources=[f"arn:aws:kms:{stack.region}:{stack.account}:key/*"],
                    conditions={
                        "StringEquals": {
                            "kms:ViaService": f"ssm.{stack.region}.amazonaws.com"
                        }
                    },
                ),
            ],
        )
