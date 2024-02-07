import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import * as core from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as codebuild from "aws-cdk-lib/aws-codebuild";

export class MaxrchungNextCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const amplifyApp = new amplify.App(this, "maxrchung-next-amplify", {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: "maxrchung",
        repository: "maxrchung-next",
        oauthToken: core.SecretValue.unsafePlainText(
          ssm.StringParameter.valueForStringParameter(
            this,
            "github-personal-access-token"
          )
        ),
      }),
      environmentVariables: {
        // ????? https://stackoverflow.com/questions/56444337/how-to-change-node-version-in-provision-step-in-amplify-console
        _CUSTOM_IMAGE: "public.ecr.aws/docker/library/node:18.19",
      },
      buildSpec: codebuild.BuildSpec.fromObjectToYaml({
        version: "1.0",
        frontend: {
          phases: {
            preBuild: {
              commands: ["npm ci"],
            },
            build: {
              commands: ["npm run build"],
            },
          },
          artifacts: {
            baseDirectory: "out",
            files: ["**/*"],
          },
          cache: {
            paths: ["node_modules/**/*"],
          },
        },
      }),
    });
    const branch = amplifyApp.addBranch("main");
    const domain = amplifyApp.addDomain("maxrchung.com");
    domain.mapRoot(branch);
  }
}
