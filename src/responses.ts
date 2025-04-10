/**
 * Blockchain address of the member
 * @example 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
 * @pattern ^[1-9A-HJ-NP-Za-km-z]{48}$
 */
export type Address = string
/**
 * Alias for the member
 * @example Alice
 * @pattern (?!^[1-9A-HJ-NP-Za-km-z]{48}$)^.{1,50}$
 */
export type Alias = string
/**
 * Either an alias of a member or their blockchain address
 */
export type AddressOrAlias = Address | Alias

/**
 * A role for a member
 */
export type Role = string | undefined

/**
 * A body for a member
 */
export type MemberBody = {
  alias?: Alias
  role?: Role
}

export type Member = {
  address: Address
  alias: Alias
  role: string | undefined
}
