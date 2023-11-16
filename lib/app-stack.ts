import type { Construct, IConstruct } from 'constructs'
import { Aspects, Duration, IAspect, Stack, StackProps } from 'aws-cdk-lib'
import { Architecture, FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda'
import { CfnFunction, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RustFunction } from 'cargo-lambda-cdk'
import * as path from 'node:path'

const authType = FunctionUrlAuthType.NONE

class SetAL2023Runtime implements IAspect {
  visit(node: IConstruct) {
    if (node instanceof CfnFunction) {
      node.runtime = Runtime.PROVIDED_AL2023.toString()
    }
  }
}

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const rustFunc = new RustFunction(this, 'rust-function', {
      architecture: Architecture.ARM_64,
      environment: {
        SALT: 'a'.repeat(16),
      },
      functionName: 'rust-function',
      manifestPath: path.join('.', 'functions', 'example', 'Cargo.toml'),
      memorySize: 8_846,
      timeout: Duration.seconds(15),
    })

    Aspects.of(rustFunc).add(new SetAL2023Runtime())
    rustFunc.addFunctionUrl({ authType })

    new NodejsFunction(this, 'node-function', {
      entry: path.join('.', 'functions', 'node', 'handler.ts'),
      functionName: 'node-function',
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
    }).addFunctionUrl({ authType })
  }
}
