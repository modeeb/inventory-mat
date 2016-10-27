using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.ServiceBus.Messaging;

namespace ProcessDeviceToCloudMessages
{
    class Program
    {
        static void Main(string[] args)
        {
            string iotHubConnectionString = "HostName=qtmatters.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=EXPgQQxs7vbxm/iZZXQzkC0E3UsmlzV2CuyL8TjjObE=";
            string iotHubD2cEndpoint = "messages/events";
            StoreEventProcessor.StorageConnectionString = "DefaultEndpointsProtocol=https;AccountName=qtmatters;AccountKey=yqgRKM2uMGvQ3sKYUycCpYRkxznNvonyPQNYM+N17YjZ7BNpOpF+vLo2R3xv9iyjUxpq8ZJ7YASmnvT3MVgRBA==;";
            StoreEventProcessor.ServiceBusConnectionString = "Endpoint=sb://qtmatters.servicebus.windows.net/;SharedAccessKeyName=send;SharedAccessKey=oeBAbi5/u1YTEhNbXcIeZL3NVfogDNTwj+m0PfK1fv4=;EntityPath=qtmatters";

            string eventProcessorHostName = Guid.NewGuid().ToString();
            EventProcessorHost eventProcessorHost = new EventProcessorHost(eventProcessorHostName, iotHubD2cEndpoint, EventHubConsumerGroup.DefaultGroupName, iotHubConnectionString, StoreEventProcessor.StorageConnectionString, "messages-events");
            Console.WriteLine("Registering EventProcessor...");
            eventProcessorHost.RegisterEventProcessorAsync<StoreEventProcessor>().Wait();

            Console.WriteLine("Receiving. Press enter key to stop worker.");
            Console.ReadLine();
            eventProcessorHost.UnregisterEventProcessorAsync().Wait();
        }
    }
}
