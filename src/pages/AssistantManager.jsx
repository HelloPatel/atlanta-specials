import AssistantChat from '../components/assistant/AssistantChat';

export default function AssistantManager() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Chat with your wedding-planning assistant — it knows your events, guests, RSVPs, and budget
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
