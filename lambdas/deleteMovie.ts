import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log("[EVENT]", JSON.stringify(event));

        const parameters = event?.pathParameters;
        const movieId = parameters?.movieId;

        if (!movieId) {
            return {
                statusCode: 400,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ Message: "Missing or invalid movieId" }),
            };
        }

        const commandOutput = await ddbDocClient.send(
            new DeleteCommand({
                TableName: process.env.TABLE_NAME,
                Key: { id: movieId },
            })
        );

        console.log("DeleteCommand response: ", commandOutput);

        return {
            statusCode: 200,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ Message: `Movie with ID ${movieId} deleted successfully` }),
        };
    } catch (error: any) {
        console.error("Error deleting movie:", error);
        return {
            statusCode: 500,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};


function createDDbDocClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    return DynamoDBDocumentClient.from(ddbClient);
}
