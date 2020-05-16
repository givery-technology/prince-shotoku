export const stripMargin = (template: TemplateStringsArray, ...expressions: unknown[]): string => {
  const result = template.reduce((accumulator, part, i) => accumulator + expressions[i - 1] + part);
  return result.trim().replace(/^\s*\|/gm, '');
};

export const oneline = (delimiter = ' ') => (template: TemplateStringsArray, ...expressions: unknown[]): string => {
  const result = template.reduce((accumulator, part, i) => accumulator + expressions[i - 1] + part);
  return result.replace(/\n\s*\|/g, delimiter);
};
