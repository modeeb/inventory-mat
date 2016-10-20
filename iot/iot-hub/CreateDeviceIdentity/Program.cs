using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.Devices;
using Microsoft.Azure.Devices.Common.Exceptions;
using System.Runtime.ExceptionServices;

namespace CreateDeviceIdentity
{
    class Program
    {
        static RegistryManager registryManager;
        static string connectionString = "HostName=qtmatters.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=7fvxqYFuQd2+/oHHJWmqXdGKUK6qZi/+3IQxP/Iiaq8=";

        private static async Task AddDeviceAsync()
        {
            string deviceId = "inventory-mat";
            Device device = null;
            ExceptionDispatchInfo capturedException = null;

            try
            {
                device = await registryManager.AddDeviceAsync(new Device(deviceId));
            }
            catch (DeviceAlreadyExistsException ex)
            {
                capturedException = ExceptionDispatchInfo.Capture(ex);                
            }

            if (capturedException != null)
            {
                device = await registryManager.GetDeviceAsync(deviceId);
                capturedException.Throw();
            }

            Console.WriteLine("Generated device key: {0}", device.Authentication.SymmetricKey.PrimaryKey);
        }

        static void Main(string[] args)
        {
            registryManager = RegistryManager.CreateFromConnectionString(connectionString);
            AddDeviceAsync().Wait();
            Console.ReadLine();
        }
    }
}
