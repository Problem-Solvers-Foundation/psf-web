/**
 * Formata números grandes de forma legível
 * Exemplos:
 * 1234 -> 1.2K
 * 1234567 -> 1.2M
 * 1234567890 -> 1.2B
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const absNum = Math.abs(num);
  
  if (absNum >= 1000000000) {
    // Bilhões
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (absNum >= 1000000) {
    // Milhões
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (absNum >= 1000) {
    // Milhares
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    // Menor que mil, retorna o número normal
    return num.toString();
  }
}

export default formatNumber;
