import { compact } from "lodash"

export const ARTIST_INSIGHT_KINDS = {
  SOLO_SHOW: { value: "SOLO_SHOW" },
  GROUP_SHOW: { value: "GROUP_SHOW" },
  COLLECTED: { value: "COLLECTED" },
  REVIEWED: { value: "REVIEWED" },
  BIENNIAL: { value: "BIENNIAL" },
  ACTIVE_SECONDARY_MARKET: { value: "ACTIVE_SECONDARY_MARKET" },
} as const

type ArtistInsightKind = keyof typeof ARTIST_INSIGHT_KINDS

export const ARTIST_INSIGHT_MAPPING = {
  SOLO_SHOW: {
    label: "Solo show at a major institution",
    description: null,
    fieldName: "solo_show_institutions",
    delimiter: "|",
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
} as const

export const getArtistInsights = (artist) => {
  const mappings = Object.entries(ARTIST_INSIGHT_MAPPING) as [
    ArtistInsightKind,
    typeof ARTIST_INSIGHT_MAPPING[ArtistInsightKind]
  ][]

  const insights = mappings.map((mapping) => {
    const [kind, { label, description, fieldName, delimiter }] = mapping

    const value = artist[fieldName]

    if (!value) return null

    const insight = {
      artist,
      count: 0,
      entities: [],
      description,
      kind,
      label,
      type: kind,
    } as any

    if (typeof value === "string") {
      const trimmed = value.trim()

      const entities = trimmed
        .split(delimiter ?? "|")
        .map((entity) => entity.trim())

      insight.count = entities.length
      insight.entities = entities
    }

    return insight
  })

  return compact(insights)
}