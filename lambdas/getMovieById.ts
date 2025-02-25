import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "";
const CAST_TABLE_NAME = process.env.CAST_TABLE_NAME || "";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const movieId = event.pathParameters?.movieId;
    if (!movieId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Movie ID is required" }),
      };
    }

    // Check if "cast=true" is provided in query parameters
    const includeCast = event.queryStringParameters?.cast === "true";

    // Fetch movie metadata from DynamoDB
    const movieCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: movieId },
    });

    const movieResult = await docClient.send(movieCommand);

    if (!movieResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Movie not found" }),
      };
    }

    let response = { ...movieResult.Item };

    // If cast=true, fetch cast information
    if (includeCast) {
      const castCommand = new GetCommand({
        TableName: CAST_TABLE_NAME, // Assuming cast information is in a different table
        Key: { movieId: movieId },
      });

      const castResult = await docClient.send(castCommand);

      if (castResult.Item) {
        response = { ...response, cast: castResult.Item.cast };
      } else {
        response = { ...response, cast: [] }; // Return empty cast if not found
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: error }),
    };
  }
};


function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
