import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_BASE_URL } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { PeopleTablePagination } from "@/features/people/people-table-pagination";
import { PeopleTableToolbar } from "@/features/people/people-table-toolbar";
import type {
  EntityKind,
  PaginatedPeopleResponse,
  PersonEntity,
} from "@/types/people";

const getEntityLabel = (entityKind: EntityKind) =>
  entityKind === "clients" ? "Client" : "Employee";

type PeopleTableSectionProps = {
  entityKind: EntityKind;
};

export const PeopleTableSection = ({ entityKind }: PeopleTableSectionProps) => {
  const entityLabel = getEntityLabel(entityKind);
  const navigate = useNavigate();
  const collectionPath = `/api/${entityKind}`;
  const [rows, setRows] = useState<PersonEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      const response = await fetch(
        `${API_BASE_URL}${collectionPath}?${params.toString()}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        throw new Error(`Failed to load ${entityKind}`);
      }

      const payload = (await response.json()) as
        | PaginatedPeopleResponse
        | PersonEntity[];
      const data = Array.isArray(payload) ? payload : payload.items;
      const totalValue = Array.isArray(payload)
        ? payload.length
        : payload.total;
      const totalPagesValue = Array.isArray(payload) ? 1 : payload.totalPages;

      setRows(data);
      setTotal(totalValue);
      setTotalPages(totalPagesValue);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [collectionPath, entityKind, page, pageSize]);

  useEffect(() => {
    const fetchRows = async () => {
      await loadRows();
    };
    void fetchRows();
  }, [loadRows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{entityLabel}s</CardTitle>
        <PeopleTableToolbar
          entityLabel={entityLabel}
          isLoading={isLoading}
          onRefresh={() => void loadRows()}
          onCreateNew={() => void navigate(`/${entityKind}/new`)}
        />
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="mb-3 text-sm text-destructive">{error}</p>
        ) : null}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4}>
                    {isLoading ? "Loading..." : `No ${entityKind} found`}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.firstName}</TableCell>
                    <TableCell>{row.lastName}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.phoneNumber}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <PeopleTablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          isLoading={isLoading}
          onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
          onNextPage={() =>
            setPage((current) => Math.min(totalPages, current + 1))
          }
        />
      </CardContent>
    </Card>
  );
};
