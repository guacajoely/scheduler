import { Button } from "@/components/ui/button";

type PeopleTableToolbarProps = {
  entityLabel: string;
  isLoading: boolean;
  onRefresh: () => void;
  onCreateNew: () => void;
};

export const PeopleTableToolbar = ({
  entityLabel,
  isLoading,
  onRefresh,
  onCreateNew,
}: PeopleTableToolbarProps) => {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onRefresh}
        disabled={isLoading}
      >
        Refresh
      </Button>
      <Button type="button" onClick={onCreateNew}>
        New {entityLabel}
      </Button>
    </div>
  );
};
