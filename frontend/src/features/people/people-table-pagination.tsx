import { Button } from "@/components/ui/button";

type PeopleTablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export const PeopleTablePagination = ({
  page,
  totalPages,
  total,
  isLoading,
  onPreviousPage,
  onNextPage,
}: PeopleTablePaginationProps) => {
  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={page <= 1 || isLoading}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={page >= totalPages || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
