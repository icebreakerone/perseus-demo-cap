export const getTrustFrameworkLogoById = (id: string) => {
  switch (id) {
    case 'http://general.registry.ib1.org':
      return '/images/logos/IB1-TF-General.png'
    case 'http://esg.registry.ib1.org':
    case 'ib1:esg.registry.icebreakerone.org':
      return '/images/logos/IB1-TF-ESG.png'
    case 'http://open-energy.registry.ib1.org':
    case 'ib1:openenergy.registry.icebreakerone.org':
    case 'ib1:icebreaker-one.?kenergy.org':
    case 'ib1:open-energy.registry.icebreakerone.org':
    case 'ib1:energy.registry.icebreakerone.org':
      return '/images/logos/IB1-TF-Energy.png'
    case 'http://water.registry.ib1.org':
    case 'ib1:water.registry.icebreakerone.org':
      return '/images/logos/IB1-TF-Water.png'
    case 'http://perseus.registry.ib1.org':
    case 'ib1:perseus.registry.icebreakerone.org':
      return '/images/logos/IB1-TF-Perseus.png'
    default:
      return 'UNMAPPED'
  }
}
export const getAssuranceLogoById = (id: string) => {
  switch (id) {
    case 'IcebreakerOne.OrganizationLevel1':
      return '/images/logos/IB1-Assurance-O1.png'
    case 'IcebreakerOne.OrganizationLevel2':
      return '/images/logos/IB1-Assurance-O2.png'
    case 'IcebreakerOne.OrganizationLevel3':
      return '/images/logos/IB1-Assurance-O3.png'
    case 'IcebreakerOne.OrganizationLevel4':
      return '/images/logos/IB1-Assurance-O4.png'
    default:
      return 'UNMAPPED'
  }
}

export const getTrustFrameworkNameById = (id: string) => {
  switch (id) {
    case 'http://esg.registry.ib1.org':
      return 'ESG'
    case 'http://general.registry.ib1.org':
      return 'General'
    case 'http://open-energy.registry.ib1.org':
      return 'Open Energy'
    case 'http://perseus.registry.ib1.org':
      return 'Perseus'
    case 'http://water.registry.ib1.org':
      return 'Water'
    default:
      return 'UNMAPPED'
  }
}
