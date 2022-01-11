import AWS from "aws-sdk";

const dyanmoConfig = {};

// ugly but OK, here's where we will check the environment
const atomicTableName = process.env.atomicCounterTableName;

const endpoint = process.env.DYNAMODB_URL;
if (endpoint) {
  dyanmoConfig.endpoint = endpoint;
  dyanmoConfig.accessKeyId = "LOCAL_FAKE_KEY"; // pragma: allowlist secret
  dyanmoConfig.secretAccessKey = "LOCAL_FAKE_SECRET"; // pragma: allowlist secret
} else {
  dyanmoConfig["region"] = "us-east-1";
}

const client = new AWS.DynamoDB.DocumentClient(dyanmoConfig);

export default {
  get: (params) => client.get(params).promise(),
  put: (params) => client.put(params).promise(),
  query: (params) => client.query(params).promise(),
  update: (params) => client.update(params).promise(),
  delete: (params) => client.delete(params).promise(),
  increment: (counterId) =>
    atomicUpdate(counterId, { tableName: atomicTableName }),
};

function atomicUpdate(counterId, options) {
  options || (options = {});

  var params = {
    TableName:options.tableName,
    Key:{},
    UpdateExpression: "",
    ExpressionAttributeValues:{
        ":incre": 1,
        ":zero": 0,
    },
    ReturnValues:"UPDATED_NEW"
  };

  var keyAttribute = options.keyAttribute || "id";
  var countAttribute = options.countAttribute || "lastValue";
  params.UpdateExpression = `set ${countAttribute} = if_not_exists(${countAttribute}, :zero) + :incre`;

  params.Key[keyAttribute] = counterId;

  return client.update(params).promise();
}
