import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda'

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const params = event.queryStringParameters
  const name = params ? params.name : 'unknown person'

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: `Hello ${name}, this is an AWS Lambda HTTP request`,
  }
}
