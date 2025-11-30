// GraphQL Operations for Confessions

export const listConfessions = /* GraphQL */ `
  query ListConfessions($limit: Int, $nextToken: String) {
    listConfessions(limit: $limit, nextToken: $nextToken) {
      items {
        id
        message
        createdAt
        status
      }
      nextToken
    }
  }
`;

export const createConfession = /* GraphQL */ `
  mutation CreateConfession($message: String!) {
    createConfession(message: $message) {
      id
      message
      createdAt
      status
    }
  }
`;

export const onCreateConfession = /* GraphQL */ `
  subscription OnCreateConfession {
    onCreateConfession {
      id
      message
      createdAt
      status
    }
  }
`;
