import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("has_conversations", () => {
    it("it returns false when there are no conversations", () => {
      const query = `
        {
          me {
            has_conversations
          }
        }
      `

      return runAuthenticatedQuery(query, {
        conversationsLoader: () => Promise.resolve({ conversations: [] }),
      }).then(({ me: { has_conversations } }) => {
        expect(has_conversations).toEqual(false)
      })
    })

    it("it returns true when there are conversations", () => {
      const query = `
        {
          me {
            has_conversations
          }
        }
      `

      return runAuthenticatedQuery(query, {
        conversationsLoader: () => Promise.resolve({ conversations: [{}] }),
      }).then(({ me: { has_conversations } }) => {
        expect(has_conversations).toEqual(true)
      })
    })
  })

  describe("Conversations", () => {
    it("returns conversations", () => {
      const query = `
        {
          me {
            conversations(first: 10) {
              edges {
                node {
                  id
                  initial_message
                  from {
                    email
                  }
                }
              }
            }
          }
        }
      `

      const conversation1 = {
        id: "2",
        initial_message: "omg im sooo interested",
        from_email: "percy@cat.com",
      }
      const conversation2 = {
        id: "3",
        initial_message: "im only a little interested",
        from_email: "percy@cat.com",
      }

      const expectedConversationData = {
        edges: [
          {
            node: {
              id: "2",
              initial_message: "omg im sooo interested",
              from: {
                email: "percy@cat.com",
              },
            },
          },
          {
            node: {
              id: "3",
              initial_message: "im only a little interested",
              from: {
                email: "percy@cat.com",
              },
            },
          },
        ],
      }

      return runAuthenticatedQuery(query, {
        conversationsLoader: () => Promise.resolve({ conversations: [conversation1, conversation2] }),
      }).then(({ me: { conversations } }) => {
        expect(conversations).toEqual(expectedConversationData)
      })
    })
  })
})
