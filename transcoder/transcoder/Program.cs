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
                    FileToTranscode fileToTranscode = GetFileToTranscode();
                    if (fileToTranscode != null)
                    {
                        string fileToTranscodePath = fileToTranscode.Path;

                        string transcodedFilePath = TranscodeFile(fileToTranscodePath);

                        if (!String.IsNullOrEmpty(transcodedFilePath))
                        {
                            bool ok = UploadFileToServer(fileToTranscode.Id, transcodedFilePath);

                            if (ok)
                            {
                                // delete local files (downloaded file and converted file)
                                File.Delete(fileToTranscodePath);
                                File.Delete(transcodedFilePath);

                                Trace.WriteLine("Great success!");
                            }
                            // delay some amount of time before looking for the next file
                        }
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

        private static FileToTranscode GetFileToTranscode()
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
                    string id = String.Empty;
                    string relativeUrl = String.Empty;

                    XmlElement fileToTranscodeElem = (XmlElement)nodes[0];

                    XmlNodeList childNodes = fileToTranscodeElem.ChildNodes;
                    foreach (XmlNode childNode in childNodes)
                    {
                        if (childNode.Name == "id")
                        {
                            id = childNode.InnerText;
                        }
                        else if (childNode.Name == "path")
                        {
                            relativeUrl = childNode.InnerText;
                        }
                    }

                    if (id != String.Empty && relativeUrl != String.Empty)
                    {
                        // XML contains the path of the file relative to root. Use that as the relative url; then use the last part of the relative Url as the file name
                        string tmpPath = System.IO.Path.Combine(_tmpFolder, relativeUrl);
                        string targetPath = System.IO.Path.Combine(_tmpFolder, System.IO.Path.GetFileName(tmpPath));

                        httpGet = new HTTPGet();
                        httpGet.RequestToFile("http://" + _bsIPAddress + "/" + relativeUrl, targetPath);

                        if (httpGet.StatusCode == 200)
                        {
                            return new FileToTranscode
                            {
                                Id = id,
                                Path = targetPath
                            };
                        }
                        else
                        {
                            // TODO - check for errors
                            return null;
                        }
                    }
                    else
                    {
                        // TODO - log an error
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
                //process.StartInfo.RedirectStandardError = true;
                process.StartInfo.RedirectStandardError = false;
                process.StartInfo.CreateNoWindow = true;

                //process.Start();

                Trace.WriteLine("Start ffmpeg");
                if (!process.Start())
                {
                    Trace.WriteLine("Error starting");
                    return null;
                }

                //StreamReader reader = process.StandardError;
                //string line;
                //while ((line = reader.ReadLine()) != null)
                //{
                //    Trace.WriteLine(line);
                //}

                process.PriorityClass = ProcessPriorityClass.Normal;

                // TODO - does ffmpeg lock up some times - if yes, is this okay?
                // no, it's not okay. after timeout, ffmpeg is still running, which is a problem
                // why is ffmpeg locking up?
                bool processExited = process.WaitForExit(5000);
                if (!processExited)
                {
                    Trace.WriteLine("Kill ffmpeg");
                    process.Kill();
                }
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

        private static bool UploadFileToServer(string id, string filePath)
        {
            string fileName = System.IO.Path.GetFileName(filePath);

            NameValueCollection nvc = new NameValueCollection();

            nvc.Add("Destination-Filename", String.Concat("content/", fileName));
            nvc.Add("Friendly-Filename", fileName);
            nvc.Add("DB-Id", id);

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

    class FileToTranscode
    {
        public string Id { get; set; }
        public string Path { get; set; }
    }

}
