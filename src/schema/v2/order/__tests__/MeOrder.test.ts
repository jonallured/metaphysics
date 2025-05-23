/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

let context, orderJson, artwork, artworkVersion

describe("Me", () => {
  beforeEach(() => {
    orderJson = {
      ...baseOrderJson,
      id: "order-id",
      source: "artwork_page",
      code: "order-code",
      mode: "buy",
      currency_code: "USD",
      buyer_id: "buyer-id-1",
      buyer_type: "user",
      seller_id: "seller-id-1",
      seller_type: "gallery",
      buyer_total_cents: null,
      items_total_cents: 500000,
      shipping_total_cents: 2000,
      buyer_phone_number: "123-456-7890",
      buyer_phone_number_country_code: "US",
      shipping_name: "John Doe",
      shipping_country: "US",
      shipping_postal_code: "10001",
      shipping_region: "NY",
      shipping_city: "New York",
      shipping_address_line1: "123 Main St",
      shipping_address_line2: "Apt 4B",
      tax_total_cents: 4299,
    }
    artwork = artwork || {
      ...baseArtwork,
      id: orderJson.line_items[0].artwork_id,
    }
    artworkVersion = artworkVersion || {
      ...baseArtwork,
      id: orderJson.line_items[0].artwork_version_id,
    }
  })

  describe("Order", () => {
    it("returns a buyer's order by id", async () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              internalID
              mode
              source
              code
              availableShippingCountries
              buyerTotal {
                display
              }
              itemsTotal {
                minor
                display
                currencyCode
              }
              shippingTotal {
                minor
              }
              taxTotal {
                minor
              }
              fulfillmentOptions {
                type
                amount {
                  currencyCode
                  display
                }
                selected
              }
              fulfillmentDetails {
                phoneNumber
                phoneNumberCountryCode
                name
                addressLine1
                addressLine2
                city
                region
                country
                postalCode
              }
              selectedFulfillmentOption {
                type
              }
              lineItems {
                internalID
                currencyCode
                artwork {
                  title
                }
                artworkVersion {
                  internalID
                }
                listPrice {
                  display
                }
                quantity
              }
            }
          }
        }
      `

      orderJson.buyer_total_cents = 500000
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        artworkLoader: jest.fn().mockResolvedValue(artwork),
        authenticatedArtworkVersionLoader: jest
          .fn()
          .mockResolvedValue(artworkVersion),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order).toEqual({
        internalID: "order-id",
        mode: "BUY",
        source: "ARTWORK_PAGE",
        code: "order-code",
        availableShippingCountries: ["US", "JP"],
        buyerTotal: {
          display: "US$5,000",
        },
        itemsTotal: {
          currencyCode: "USD",
          display: "US$5,000",
          minor: 500000,
        },
        shippingTotal: {
          minor: 2000,
        },
        taxTotal: {
          minor: 4299,
        },
        fulfillmentOptions: [
          {
            type: "PICKUP",
            amount: {
              display: "US$0",
              currencyCode: "USD",
            },
            selected: null,
          },
          {
            type: "DOMESTIC_FLAT",
            amount: {
              display: "US$100",
              currencyCode: "USD",
            },
            selected: true,
          },
        ],
        fulfillmentDetails: {
          addressLine1: "123 Main St",
          addressLine2: "Apt 4B",
          city: "New York",
          country: "US",
          name: "John Doe",
          phoneNumber: "123-456-7890",
          phoneNumberCountryCode: "US",
          postalCode: "10001",
          region: "NY",
        },
        selectedFulfillmentOption: {
          type: "DOMESTIC_FLAT",
        },
        lineItems: [
          {
            internalID: "line-item-id-0",
            artwork: {
              title: "Artwork Title",
            },
            artworkVersion: {
              internalID: "artwork-version-id-0",
            },
            currencyCode: "USD",
            listPrice: {
              display: "US$100",
            },
            quantity: 1,
          },
        ],
      })
    })

    describe("seller", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              seller {
                __typename
                ... on Partner {
                  name
                  merchantAccount {
                    externalId
                  }
                }
              }
            }
          }
        }
      `

      beforeEach(() => {
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          partnerLoader: jest
            .fn()
            .mockResolvedValue({ id: "partner-id", name: "Kyoto Art Gallery" }),
          partnerMerchantAccountsLoader: jest.fn().mockResolvedValue({
            body: [
              {
                external_id: "acct_123",
              },
            ],
          }),
        }
      })

      it("returns seller details", async () => {
        const result = await runAuthenticatedQuery(query, context)

        expect(result).toEqual({
          me: {
            order: {
              seller: {
                __typename: "Partner",
                name: "Kyoto Art Gallery",
                merchantAccount: {
                  externalId: "acct_123",
                },
              },
            },
          },
        })
      })

      it("returns null seller when partner not found", async () => {
        context.partnerLoader = jest.fn().mockRejectedValue({
          statusCode: 404,
          body: {
            error: "Partner Not Found",
          },
        })

        const result = await runAuthenticatedQuery(query, context)

        expect(result).toEqual({
          me: {
            order: {
              seller: null,
            },
          },
        })
      })

      it("returns null merchant account when no merchant account", async () => {
        context.partnerMerchantAccountsLoader = jest
          .fn()
          .mockResolvedValue({ body: [] })

        const result = await runAuthenticatedQuery(query, context)

        expect(result).toEqual({
          me: {
            order: {
              seller: {
                __typename: "Partner",
                name: "Kyoto Art Gallery",
                merchantAccount: null,
              },
            },
          },
        })
      })
    })

    describe("taxTotal", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              taxTotal {
                minor
              }
            }
          }
        }
      `
      it("returns taxTotal when present", async () => {
        orderJson.tax_total_cents = 4299
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.taxTotal).toEqual({
          minor: 4299,
        })
      })

      it("returns 0 when taxTotal is 0", async () => {
        orderJson.tax_total_cents = 0
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }
        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.taxTotal).toEqual({
          minor: 0,
        })
      })

      it("returns null when taxTotal is not present", async () => {
        orderJson.tax_total_cents = null
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.taxTotal).toEqual(null)
      })
    })
  })
})
