"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { applyForCreatorSchema, type ApplyForCreatorInput } from "@/lib/validation";
import { applyForCreator } from "@/actions/creator-actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CreatorApplicationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ApplyForCreatorInput>({
    resolver: zodResolver(applyForCreatorSchema),
    defaultValues: {
      applicationReason: "",
      subscriptionPrice: 999, // $9.99 in cents
      allowMessages: true,
    },
  });

  const subscriptionPrice = form.watch("subscriptionPrice");
  const displayPrice = (subscriptionPrice / 100).toFixed(2);

  async function onSubmit(data: ApplyForCreatorInput) {
    setIsLoading(true);
    
    try {
      const result = await applyForCreator(data);
      
      if (result.success) {
        toast.success("Application submitted successfully! We'll review it soon.");
        router.push("/creator/status");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit application");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apply to Become a Creator</CardTitle>
          <CardDescription>
            Tell us why you want to be a creator and set your subscription price.
            We'll review your application and get back to you within 48 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="applicationReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why do you want to be a creator?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about the content you plan to create, your audience, and why you'd be a great creator on our platform..."
                        className="min-h-[150px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 50 characters. Be specific about your content plans.
                    </FormDescription>
                    <div className="text-xs text-muted-foreground">
                      {field.value.length} / 1000 characters
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subscriptionPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Subscription Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number"
                          min="2.99"
                          max="99.99"
                          step="0.01"
                          className="pl-9"
                          value={(field.value / 100).toFixed(2)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            field.onChange(Math.round(value * 100));
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Set your monthly subscription price (minimum $2.99, maximum $99.99)
                    </FormDescription>
                    <div className="text-sm font-medium mt-2">
                      Subscribers will pay: ${displayPrice}/month
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowMessages"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Allow Direct Messages
                      </FormLabel>
                      <FormDescription>
                        Let subscribers send you direct messages
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Our team will review your application within 48 hours</li>
                  <li>You'll receive an email notification with our decision</li>
                  <li>If approved, you can start posting content immediately</li>
                  <li>You'll need to connect a payout method to receive earnings</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
