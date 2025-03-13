export interface IConsumption {
  value: number
  unitCode: string
}

export interface IRegister {
  type: string
  from: string
  to: string
  consumption: IConsumption
}

export interface IMeterData {
  data: IRegister[]
}
