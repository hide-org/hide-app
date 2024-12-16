import { Card, CardContent } from './ui/card';

export const Details = () => {
  return (
    <div className="w-64 border-l p-4">
      <Card className="h-full">
        <CardContent>
          <h2 className="font-semibold mb-4">Details</h2>
          {/* Add details or context here */}
        </CardContent>
      </Card>
    </div>
  );
};