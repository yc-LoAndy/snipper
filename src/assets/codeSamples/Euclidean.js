/**
 * Euclidean Algorithm
 */
function gcd(a, b) {
    a = Math.abs(a)
    b = Math.abs(b)
    if (b === 0)
        return a

    return gcd(b, a % b)
}
