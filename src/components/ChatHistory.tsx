import { Card, CardContent } from './ui/card';

export const ChatHistory = () => {
  return (
    <div className="w-64 border-r p-4">
      <Card className="h-full">
        <CardContent>
          <h2 className="font-semibold mb-4">Chat History</h2>
          {/* Add chat history here */}
        </CardContent>
      </Card>
    </div>
  );
};