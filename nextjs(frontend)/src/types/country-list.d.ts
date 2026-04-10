declare module "country-list" {
    export type CountryListItem = {
        code: string
        name: string
    }

    export function getData(): CountryListItem[]
}
