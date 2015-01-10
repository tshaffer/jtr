using System;
using System.Diagnostics;
using System.IO;
using System.Collections.Specialized;
using System.Xml;

namespace transcoder
{
    class Program
    {
        private static string _bsIPAddress = "192.168.2.9:8080";
        private static string _tmpFolder = String.Empty;

        static void Main(string[] args)
        {
            try
            {
                Initialize();

                while (true)
                {
                    string fileToTranscodePath = GetFileToTranscode();

                    string transcodedFilePath = TranscodeFile(fileToTranscodePath);

                    if (!String.IsNullOrEmpty(transcodedFilePath))
                    {
                        bool ok = UploadFileToServer(transcodedFilePath);

                        if (ok)
                        {
                            // delete local files (downloaded file and converted file)
                            File.Delete(fileToTranscodePath);
                            File.Delete(transcodedFilePath);
                        }
                        // delay some amount of time before looking for the next file
                    }
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine("Exception in Main: " + ex.ToString());
            }
        }

        private static void Initialize()
        {
            _tmpFolder = System.Windows.Forms.Application.LocalUserAppDataPath;

            _tmpFolder = System.IO.Path.Combine(_tmpFolder, "tmp");
            if (!Directory.Exists(_tmpFolder))
            {
                Trace.WriteLine("Create temporary folder : " + _tmpFolder);
                Directory.CreateDirectory(_tmpFolder);
            }
        }

        private static string GetFileToTranscode()
        {
            HTTPGet httpGet = new HTTPGet();

            string url = String.Concat("http://", _bsIPAddress, "/fileToTranscode");
            httpGet.Timeout = 120000;   // 2 minutes - long enough for large files?

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

                    // XML contains the path of the file relative to root. Use that as the relative url; then use the last part of the relative Url as the file name
                    string relativeUrl = fileToTranscodeElem.InnerText;
                    string tmpPath = System.IO.Path.Combine(_tmpFolder, relativeUrl);
                    string targetPath = System.IO.Path.Combine(_tmpFolder, System.IO.Path.GetFileName(tmpPath));

                    httpGet = new HTTPGet();
                    httpGet.RequestToFile("http://" + _bsIPAddress + "/" + relativeUrl, targetPath);

                    if (httpGet.StatusCode == 200)
                    {
                        return targetPath;
                    }
                    else
                    {
                        // TODO - check for errors
                        return null;
                    }
                }
            }
            else
            {
                // no file to transcode or an error
                // TODO log it.
                // TODO wait for a while
            }

            return null;
        }

        public static string TranscodeFile(string sourcePath)
        {
            string targetPath = System.IO.Path.Combine(_tmpFolder, System.IO.Path.GetFileNameWithoutExtension(sourcePath) + ".mp4");

            string ffmpegArgs = String.Format("-i \"{0}\" -bsf:a aac_adtstoasc -c copy  \"{1}\"", sourcePath, targetPath);

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
                    return null;
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
                Trace.WriteLine("ffmpeg exception converting " + sourcePath + " to " + targetPath);
                Trace.WriteLine(ex.ToString());

                targetPath = null;
            }
            finally
            {
                process.Dispose();
            }

            return targetPath;
        }

        private static bool UploadFileToServer(string filePath)
        {
            string fileName = System.IO.Path.GetFileName(filePath);

            NameValueCollection nvc = new NameValueCollection();

            nvc.Add("Destination-Filename", String.Concat("content/", fileName));
            nvc.Add("Friendly-Filename", fileName);

            try
            {
                string responseString = HTTPPost.HttpUploadFile("http://" + _bsIPAddress + "/UploadFile", filePath, fileName, nvc);
                if (responseString != "RECEIVED")
                {
                    // TODO - error handling / logging
                    return false;
                }
            }
            catch (Exception ex)
            {
                // TODO - error handling / logging
                Trace.WriteLine("Error in HTTPPost: " + ex.ToString());
                return false;
            }

            return true;
        }
    }
}
