export interface ITrustFramework {
  identifier: string
  name: string
  title: string
}

export interface ICatalog {
  description: string
  format: string
  homepage: string
  'ib1:datasetAssurance': string[]
  identifier: string
  shortcode: string
  title: string
  trustFrameworks: ITrustFramework[]
  url: string
}
