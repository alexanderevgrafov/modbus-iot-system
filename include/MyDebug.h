class MyDebug
{
private:
 char buff[255];

public:
    void log(const char* s1)
    {
        Serial.println(s1);
    }
    void log(const char* s1, int32_t n)
    {
        sprintf(this->buff, s1, n);
        this->log(this->buff);
    }
    void log(const char* s1, int32_t n1, int32_t n2)
    {
        sprintf(this->buff, s1, n1, n2);
        this->log(this->buff);
    }
        void log(const char* s1, int32_t n1, int32_t n2, int32_t n3)
    {
        sprintf(this->buff, s1, n1, n2, n3);
        this->log(this->buff);
    }
    // void log(String s1, String s2, String s3)
    // {
    //     this->log(s1, s2 + s3);
    // }
    // void log(String s1, String s2, String s3, String s4)
    // {
    //     this->log(s1, s2, s3 + s4);
    // }
};