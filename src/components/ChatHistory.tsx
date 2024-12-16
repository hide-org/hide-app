import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const ChatHistory = () => {
  return (
    <div className="w-64 border-r p-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Chat History</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add chat history here */}
        </CardContent>
      </Card>
    </div>
  );
};
