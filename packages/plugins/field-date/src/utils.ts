/**
 * Get the string formatted locally to the user.
 *
 * @param dateString A string in the format 'yyyy-mm-dd'
 * @returns the locale date string for the date.
 */
export function getLocaleDateString(dateString: string): string {
  // NOTE: `date.toLocaleDateString()` will be the day before for western dates
  // due to an unspecified time & timezone assuming midnight at GMT+0.
  const date = new Date(dateString);

  // NOTE: This format varies per region.
  // Ex: "5/12/2023", "12/05/2023", "12.5.2023", "2023/5/12", "१२/५/२०२३"
  const language = navigator.language ?? 'en-US';
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat#using_options
  return new Intl.DateTimeFormat(language, {
    // Print the date for GMT+0 since the date object assumes midnight at GMT+0.
    timeZone: 'UTC',
  }).format(date);
}
