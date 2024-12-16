import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const Details = () => {
  return (
    <div className="w-64 border-l p-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add details or context here */}
        </CardContent>
      </Card>
    </div>
  );
};
