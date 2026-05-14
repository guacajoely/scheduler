import { Button } from "@/components/ui/button";

type PeopleTableToolbarProps = {
  entityLabel: string;
  onCreateNew: () => void;
};

export const PeopleTableToolbar = ({
  entityLabel,
  onCreateNew,
}: PeopleTableToolbarProps) => {
  return (
    <div className="flex gap-2">
      <Button type="button" onClick={onCreateNew}>
        New {entityLabel}
      </Button>
    </div>
  );
};
