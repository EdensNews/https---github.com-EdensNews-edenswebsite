export function createPageUrl(pageName: string) {
    const [rawPath, rawQuery] = pageName.split('?');
    const path = '/' + rawPath.toLowerCase().replace(/ /g, '-');
    return rawQuery ? `${path}?${rawQuery}` : path;
}