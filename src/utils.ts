export function isNewLineChar(ch: string) {
  let code = ch.charCodeAt(0);
  return code == 10 || code == 13;
}


// <USP> 参考 https://ecma262.docschina.org/#sec-white-space 和 https://www.compart.com/en/unicode/category/Zs
export const nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/