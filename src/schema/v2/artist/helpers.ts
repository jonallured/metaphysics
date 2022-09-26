import { compact } from "lodash"
import { auctionRecordsTrusted } from "schema/v2/artist"
import { priceDisplayText } from "lib/moneyHelpers"

export const ARTIST_INSIGHT_KINDS = {
  SOLO_SHOW: { value: "SOLO_SHOW" },
  GROUP_SHOW: { value: "GROUP_SHOW" },
  COLLECTED: { value: "COLLECTED" },
  REVIEWED: { value: "REVIEWED" },
  BIENNIAL: { value: "BIENNIAL" },
  ACTIVE_SECONDARY_MARKET: { value: "ACTIVE_SECONDARY_MARKET" },
  HIGH_AUCTION_RECORD: { value: "HIGH_AUCTION_RECORD" },
} as const

type ArtistInsightKind = keyof typeof ARTIST_INSIGHT_KINDS

export const ARTIST_INSIGHT_MAPPING = {
  SOLO_SHOW: {
    label: "Solo show at a major institution",
    description: null,
    fieldName: "solo_show_institutions",
    delimiter: "|",
    getEntities: (artist) =>
      getInsightEntities(artist.solo_show_institutions, "|"),
  },
  GROUP_SHOW: {
    label: "Group show at a major institution",
    description: null,
    fieldName: "group_show_institutions",
    delimiter: "|",
  },
  COLLECTED: {
    label: "Collected by a major institution",
    description: null,
    fieldName: "collections",
    delimiter: "\n",
  },
  REVIEWED: {
    label: "Reviewed by a major art publication",
    description: null,
    fieldName: "review_sources",
    delimiter: "|",
  },
  BIENNIAL: {
    label: "Included in a major biennial",
    description: null,
    fieldName: "biennials",
    delimiter: "|",
  },
  ACTIVE_SECONDARY_MARKET: {
    label: "Active Secondary Market",
    description: "Recent auction results in the Artsy Price Database",
    fieldName: "active_secondary_market",
    delimiter: null,
  },
  HIGH_AUCTION_RECORD: {
    label: "High Auction Record",
    description: null,
    fieldName: "highAuctionRecord",
    delimiter: null,
  },
} as const

const getInsightEntities = (value, delimiter) => {
  if (typeof value !== "string") return []

  return value
    .trim()
    .split(delimiter)
    .map((entity) => entity.trim())
}

export const getArtistInsights = (artist) => {
  const mappings = Object.entries(ARTIST_INSIGHT_MAPPING) as [
    ArtistInsightKind,
    typeof ARTIST_INSIGHT_MAPPING[ArtistInsightKind]
  ][]

  const insights = mappings.map((mapping) => {
    const [
      kind,
      { getEntities, delimiter, description, fieldName, label },
    ] = mapping

    if (kind === "HIGH_AUCTION_RECORD") {
      return {
        artist,
        count: 0,
        entities: [],
        description: artist[fieldName],
        kind,
        label,
        type: kind,
      }
    } else {
      const value = artist[fieldName]

      if (!value) return null

      const entities = getEntities(value, delimiter ?? "|")

      return {
        artist,
        count: entities.length,
        entities,
        description,
        kind,
        label,
        type: kind,
      }
    }
  })

  return compact(insights)
}

export const getAuctionRecord = async (artist, auctionLotsLoader) => {
  if (!auctionRecordsTrusted.includes(artist._id)) return null

  const response = await auctionLotsLoader({
    artist_id: artist._id,
    size: 1,
    sort: "-price_realized_cents_usd,-sale_date",
  })

  const auctionLot = response._embedded.items[0]
  const { currency, price_realized_cents } = auctionLot
  const price = priceDisplayText(price_realized_cents, currency, "0.0a")
  const year = auctionLot.sale_date.split("-")[0]
  const highAuctionRecord = [price, auctionLot.organization, year].join(", ")

  return highAuctionRecord
}
