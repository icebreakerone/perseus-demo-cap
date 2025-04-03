from aws_cdk import aws_iam as iam, Aws
from constructs import Construct


class SecretsManagerPolicy(Construct):
    def __init__(self, scope: Construct, id: str, app_name: str, env_name: str):
        super().__init__(scope, id)
        self.policy = iam.ManagedPolicy(
            self,
            "SSMAccessPolicy",
            managed_policy_name=f"{app_name}-{env_name}-SecretsManagerPolicy",
            statements=[
                iam.PolicyStatement(
                    actions=["secretsmanager:GetSecretValue"],
                    resources=[
                        f"arn:aws:secretsmanager:{Aws.REGION}:{Aws.ACCOUNT_ID}:secret:{env_name}/perseus-demo-cap/mtls-key-bundle*"
                    ],
                ),
                iam.PolicyStatement(
                    actions=["kms:Decrypt"],
                    resources=["*"],
                ),
            ],
        )
