using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Diagnostics;
using System.IO;
using System.Collections.Specialized;
using System.Xml;

namespace transcoder
{
    class Program
    {
        private string _tmpFolder = String.Empty;

        static void Main(string[] args)
        {
            // perform initialization
            
            // while true

            //      get a file to transcode

            //      if file returned

            //          run ffmpeg on it

            //          invoke transcoded file to push it to device

            //          wait x amount of time

            //      else
            
            //          wait y amount of time

            //      endif

            // end while

            HTTPGet httpGet = new HTTPGet();

            string tmpFolder = System.Windows.Forms.Application.LocalUserAppDataPath;

            tmpFolder = System.IO.Path.Combine(tmpFolder, "tmp");
            if (!Directory.Exists(tmpFolder))
            {
                Trace.WriteLine("Create temporary folder : " + tmpFolder);
                Directory.CreateDirectory(tmpFolder);
            }

            string tsFilePath = System.IO.Path.Combine(tmpFolder, "myFile.ts");


            string url = String.Concat("http://", "192.168.2.9", ":8080/fileToTranscode");
            httpGet.Timeout = 10000;

            httpGet.Request(url);
            if (httpGet.StatusCode == 200)
            {
                string xml = httpGet.ResponseBody;
                XmlDocument doc = new XmlDocument();
                doc.LoadXml(xml);

                XmlNodeList nodes = doc.GetElementsByTagName("FileToTranscode");
                if (nodes.Count > 0)
                {
                    XmlElement fileToTranscodeElem = (XmlElement)nodes[0];
                    string path = fileToTranscodeElem.InnerText;

                    httpGet = new HTTPGet();
                    httpGet.RequestToFile("http://192.168.2.9:8080/" + path, tsFilePath);

                }

            }


            tsFilePath = System.IO.Path.Combine(tmpFolder, "myFile.ts");
            string mp4FilePath = System.IO.Path.Combine(tmpFolder, "myFile.mp4");

            //UploadToServer(mp4FilePath);

            return;

            //HTTPGet httpGet = new HTTPGet();

            httpGet.RequestToFile("http://192.168.2.9:8080/content/20150103T120300.ts", tsFilePath);

            string ffmpegArgs = String.Format("-i \"{0}\" -bsf:a aac_adtstoasc -c copy  \"{1}\"", tsFilePath, mp4FilePath);

            Process process = new Process();
            try
            {
                process.StartInfo.FileName = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ffmpeg.exe");
                process.StartInfo.Arguments = ffmpegArgs;
                process.StartInfo.UseShellExecute = false;
                process.StartInfo.RedirectStandardError = true;
                process.StartInfo.CreateNoWindow = true;

                //process.Start();

                if (!process.Start())
                {
                    Trace.WriteLine("Error starting");
                    return;
                }
                StreamReader reader = process.StandardError;
                string line;
                while ((line = reader.ReadLine()) != null)
                {
                    Trace.WriteLine(line);
                }
                process.PriorityClass = ProcessPriorityClass.Normal;
                process.WaitForExit(60000);
            }
            catch (Exception ex)
            {
                //Trace.WriteLine("Exception in ffmpeg: source = " + source + ", path = " + path);
                //Trace.WriteLine("Exception in ffmpeg: AppDomain.CurrentDomain.BaseDirectory = " + AppDomain.CurrentDomain.BaseDirectory);
                Trace.WriteLine(ex.ToString());
            }
            finally
            {
                process.Dispose();
            }
        }

        private static void Initialize()
        {
        }

        private static void UploadToServer(string filePath)
        {
            string fileName = System.IO.Path.GetFileName(filePath);

            NameValueCollection nvc = new NameValueCollection();

            nvc.Add("Destination-Filename", String.Concat("content/", fileName));
            nvc.Add("Friendly-Filename", fileName);

            HTTPPost.HttpUploadFile("http://192.168.2.9:8080/UploadFile", filePath, "myFile.mp4", nvc);
        }
    }
}
