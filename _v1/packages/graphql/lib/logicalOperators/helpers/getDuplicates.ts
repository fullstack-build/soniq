export default function getDuplicates(values: string[]): string[] {
  const duplicates = [];
  const uniqueValues = [];
  values.forEach((value) => {
    if (uniqueValues.includes(value)) duplicates.push(value);
    else uniqueValues.push(value);
  });
  return duplicates;
}
