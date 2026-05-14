import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export const LoadingPage = () => (
  <main className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Checking session...</CardTitle>
      </CardHeader>
    </Card>
  </main>
);
