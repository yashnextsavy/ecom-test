export const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}