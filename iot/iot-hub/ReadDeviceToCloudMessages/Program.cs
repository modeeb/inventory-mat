using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.ServiceBus.Messaging;
using System.Threading;

namespace ReadDeviceToCloudMessages
{
    class Program
    {
        static string connectionString = "HostName=qtmatters.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=7fvxqYFuQd2+/oHHJWmqXdGKUK6qZi/+3IQxP/Iiaq8=";
        static string iotHubD2cEndpoint = "messages/events";
        static EventHubClient eventHubClient;

        private static async Task ReceiveMessagesFromDeviceAsync(string partition, CancellationToken ct)
        {
            var eventHubReceiver = eventHubClient.GetDefaultConsumerGroup().CreateReceiver(partition);
            while (true)
            {
                if (ct.IsCancellationRequested) break;
                EventData eventData = await eventHubReceiver.ReceiveAsync();
                if (eventData == null) continue;

                string data = Encoding.UTF8.GetString(eventData.GetBytes());
                Console.WriteLine("Message received. Partition: {0} Data: '{1}'", partition, data);
            }
        }

        static void Main(string[] args)
        {
            CancellationToken ct = GetCancellationToken();

            eventHubClient = EventHubClient.CreateFromConnectionString(connectionString, iotHubD2cEndpoint);

            var tasks = ReceiveMessagesFromDeviceAsync("1", ct);
            //var tasks = ReceiveMessagesFromAllDevicesAsync(ref ct);
            Task.WaitAll(tasks);
        }

        private static Task[] ReceiveMessagesFromAllDevicesAsync(ref CancellationToken ct)
        {
            var d2cPartitions = eventHubClient.GetRuntimeInformation().PartitionIds;

            var tasks = new List<Task>();
            foreach (string partition in d2cPartitions)
            {
                tasks.Add(ReceiveMessagesFromDeviceAsync(partition, ct));
            }
            return tasks.ToArray();
        }

        private static CancellationToken GetCancellationToken()
        {
            Console.WriteLine("Receive messages. Ctrl-C to exit.\n");
            CancellationTokenSource cts = new CancellationTokenSource();

            System.Console.CancelKeyPress += (s, e) =>
            {
                e.Cancel = true;
                cts.Cancel();
                Console.WriteLine("Exiting...");
            };
            return cts.Token;
        }
    }
}
