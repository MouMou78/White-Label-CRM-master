import { useState } from "react";
import { useLocation } from "wouter";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Video } from "lucide-react";
import { toast } from "sonner";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function BookDemo() {
  const [, setLocation] = useLocation();

  
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [title, setTitle] = useState<string>("Demo Call");
  const [description, setDescription] = useState<string>("");

  const { data: managers } = trpc.calendar.listManagers.useQuery();
  
  const { data: availability } = trpc.calendar.getAvailability.useQuery(
    {
      salesManagerId: selectedManager,
      date: selectedDate?.toISOString().split('T')[0] || "",
    },
    { enabled: !!selectedManager && !!selectedDate }
  );

  const bookDemoMutation = trpc.calendar.bookDemo.useMutation({
    onSuccess: (data) => {
      toast.success(`Demo Booked! Meet link: ${data.meetLink}`);
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Booking Failed: ${error.message}`);
    },
  });

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      setSelectedTime(""); // Reset time when date changes
    }
  };

  const handleBookDemo = () => {
    if (!selectedManager || !selectedDate || !selectedTime || !title) {
      toast.error("Please fill in all required fields");
      return;
    }

    bookDemoMutation.mutate({
      salesManagerId: selectedManager,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      title,
      description,
    });
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="container max-w-6xl py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Book a Demo</h1>
        <p className="text-muted-foreground mt-2">
          Schedule a 30-minute demo call with a sales manager
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Selection */}
        <div className="space-y-6">
          {/* Manager Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Sales Manager
              </CardTitle>
              <CardDescription>Choose who you'd like to meet with</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedManager} onValueChange={setSelectedManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers?.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name || manager.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date Selection */}
          {selectedManager && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
                <CardDescription>Weekends are disabled</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  minDate={new Date()}
                  tileDisabled={({ date }) => isWeekend(date)}
                  className="mx-auto"
                />
              </CardContent>
            </Card>
          )}

          {/* Time Selection */}
          {selectedManager && selectedDate && availability && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Select Time
                </CardTitle>
                <CardDescription>Available 30-minute slots (9 AM - 5 PM)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {availability.slots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className="w-full"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Details & Summary */}
        <div className="space-y-6">
          {/* Demo Details */}
          <Card>
            <CardHeader>
              <CardTitle>Demo Details</CardTitle>
              <CardDescription>Provide information about the demo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Demo Call"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any notes or topics to discuss..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Booking Summary */}
          {selectedManager && selectedDate && selectedTime && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Sales Manager</p>
                  <p className="font-medium">
                    {managers?.find(m => m.id === selectedManager)?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedTime} (30 minutes)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meeting Link</p>
                  <p className="text-sm text-muted-foreground">
                    Google Meet link will be generated upon booking
                  </p>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={handleBookDemo}
                  disabled={bookDemoMutation.isPending}
                >
                  {bookDemoMutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
