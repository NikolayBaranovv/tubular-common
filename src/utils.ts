import { ColumnDataType, ColumnModel, parseDateColumnValue } from '.';

export const parsePayload = (row: Record<string, unknown>, columns: ColumnModel[]): Record<string, unknown> =>
    columns.reduce((obj: Record<string, unknown>, column: ColumnModel, key: number) => {
        obj[column.name] = row[key] || row[column.name];

        return obj;
    }, {});

export const getColumnAlign = (column: ColumnModel): 'inherit' | 'left' | 'center' | 'right' | 'justify' => {
    switch (column.dataType) {
        case ColumnDataType.Numeric:
            return 'right';
        case ColumnDataType.Boolean:
            return 'center';
        default:
            return 'inherit';
    }
};

const getRealCellValue = (column: ColumnModel, value: any, isHeader = false): string => {
    if (isHeader) {
        return (value || '').toString();
    }

    switch (column.dataType) {
        case ColumnDataType.Date:
        case ColumnDataType.DateTime:
        case ColumnDataType.DateTimeUtc:
            return parseDateColumnValue(column, value);
        case ColumnDataType.Boolean:
            return value === true ? 'Yes' : 'No';
        default:
            return (value || '').toString();
    }
};

const getCellValue = (column: ColumnModel, row: any, isHeader) => {
    return column.isComputed
        ? column.getComputedStringValue(column, row, isHeader)
        : getRealCellValue(column, row[column.name], isHeader);
};

const processRow = (row: any, columns: ColumnModel[], isHeader: boolean): string => {
    const finalVal = columns.reduce<string>((prev: string, currentColumn: ColumnModel) => {
        let result = getCellValue(currentColumn, row, isHeader).replace(/"/g, '""');

        if (result.search(/("|,|\n)/g) >= 0) {
            result = `"${result}"`;
        }

        return `${prev}${result},`;
    }, '');

    return `${finalVal.replace(/(^,)|(,$)/g, '')}\n`;
};

export const getCsv = (gridResult: [], columns: ColumnModel[]): string => {
    const exportableColumns = columns.filter(
        (c) => (c.visible && c.exportable) || (c.isComputed && !c.getComputedStringValue),
    );

    return gridResult.reduce(
        (prev: string, row: any) => prev + processRow(row, exportableColumns, false),
        processRow(
            exportableColumns
                .map((x: ColumnModel) => ({ [x.name]: x.label }))
                .reduce((prev, current) => ({ ...prev, ...current }), {}),
            exportableColumns,
            true,
        ),
    );
};

export const getHtml = (gridResult: [], columns: ColumnModel[]): string => {
    const exportableColumns = columns.filter(
        (c) => (c.visible && c.exportable) || (c.isComputed && !c.getComputedStringValue),
    );

    return `<table class="table table-bordered table-striped"><thead><tr>${exportableColumns.reduce(
        (prev: string, el: ColumnModel) => `${prev}<th>${el.label || el.name}</th>`,
        '',
    )}</tr></thead><tbody>${gridResult.reduce(
        (prevRow: string, row: any) =>
            `${prevRow}<tr>${exportableColumns.reduce(
                (prev: string, currentColumn: ColumnModel) =>
                    `${prev}<td>${getCellValue(currentColumn, row, false)}</td>`,
                '',
            )}</tr>`,
        '',
    )}</tbody></table>`;
};
