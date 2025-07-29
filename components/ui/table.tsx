import * as React from "react";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className="w-full caption-bottom text-sm"
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ ...props }, ref) => (
  <thead ref={ref} className="bg-gray-50" {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ ...props }, ref) => (
  <tbody
    ref={ref}
    className="bg-white divide-y divide-gray-200"
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ ...props }, ref) => (
  <tfoot
    ref={ref}
    className="bg-gray-50 font-medium"
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ ...props }, ref) => (
  <tr
    ref={ref}
    className="hover:bg-gray-50 cursor-pointer"
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ ...props }, ref) => (
  <th
    ref={ref}
    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ ...props }, ref) => (
  <td
    ref={ref}
    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ ...props }, ref) => (
  <caption
    ref={ref}
    className="mt-4 text-sm text-gray-500"
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}; 